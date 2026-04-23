package com.arogyajal.service;

import com.arogyajal.model.IssueReport;
import com.arogyajal.repository.IssueReportRepository;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class IssueReportService {
    
    private static final Logger log = LoggerFactory.getLogger(IssueReportService.class);
    private final IssueReportRepository repository;
    
    public IssueReportService(IssueReportRepository repository) {
        this.repository = repository;
    }
    
    public String saveIssueReport(IssueReport issueReport) throws ExecutionException, InterruptedException {
        // Set timestamps if not provided
        if (issueReport.getCreatedAt() == null) {
            issueReport.setCreatedAt(Timestamp.now());
        }
        issueReport.setUpdatedAt(Timestamp.now());
        
        // Set default status if not provided
        if (issueReport.getStatus() == null) {
            issueReport.setStatus("pending");
        }
        
        // Set synced flag
        if (issueReport.getSynced() == null) {
            issueReport.setSynced(1);
        }
        
        log.info("Saving issue report: {}", issueReport.getId());
        return repository.save(issueReport);
    }
    
    public IssueReport getIssueReportById(String id) throws ExecutionException, InterruptedException {
        return repository.findById(id);
    }
    
    public List<IssueReport> getAllIssueReports() throws ExecutionException, InterruptedException {
        return repository.findAll();
    }
    
    public List<IssueReport> getIssueReportsByReporter(String reporterId) throws ExecutionException, InterruptedException {
        return repository.findByReporterId(reporterId);
    }
    
    public List<IssueReport> getIssueReportsBySeverity(String severity) throws ExecutionException, InterruptedException {
        return repository.findBySeverity(severity);
    }
    
    public List<IssueReport> getIssueReportsByStatus(String status) throws ExecutionException, InterruptedException {
        return repository.findByStatus(status);
    }
}
